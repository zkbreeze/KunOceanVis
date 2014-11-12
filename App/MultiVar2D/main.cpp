//
//  main.cpp
//
//
//  Created by Kun Zhao on 2014-11-11 14:50:58.
//
//

#include <iostream>
#include <kvs/glut/Application>
#include <kvs/glut/Screen>
#include <kvs/StructuredVolumeObject>
#include <kvs/StructuredVolumeImporter>
#include <kvs/HydrogenVolumeData>
#include <kvs/CommandLine>
#include "RayCastingRenderer2D.h"
#include <kvs/TransferFunction>
#include <kvs/ColorMap>
#include <kvs/OpacityMap>

int main( int argc, char** argv )
{
    kvs::glut::Application app( argc, argv );
    kvs::glut::Screen screen( &app );

    kvs::CommandLine param( argc, argv );
    param.addHelpOption();
    param.addOption( "1", "Input the first volume.", 1, true );
    param.addOption( "2", "Input the second volume.", 1, true );
    if ( !param.parse() ) return 1;    

    std::string filename1 = param.optionValue<std::string>( "1" );
    std::string filename2 = param.optionValue<std::string>( "2" );

    kvs::StructuredVolumeObject* volume_1 = new kvs::StructuredVolumeImporter( filename1 );
    kvs::StructuredVolumeObject* volume_2 = new kvs::StructuredVolumeImporter( filename2 );
    
    // set the 2d transfer function
    size_t side_size = 10;
    kvs::TransferFunction tfunc( side_size * side_size );

    kvs::ColorMap cmap;
    kvs::OpacityMap omap;
    for ( size_t j = 0; j < side_size; j++ )
        for ( size_t i = 0; i < side_size; i++ )
        {
            unsigned char red = ( (float)i / side_size ) * 255;
            unsigned char green = ( (float)j / side_size ) * 255;
            unsigned char blue = ( (float)j / side_size ) * 255;
            float opacity = (float) i * j / ( side_size * side_size );

            float location = (float)( i + j * side_size ) / (side_size * side_size );
            cmap.addPoint( location, kvs::RGBColor( red, green, blue ) );
            omap.addPoint( location, opacity );
        }
    cmap.create();
    omap.create();
    tfunc.setColorMap( cmap );
    tfunc.setOpacityMap( omap );
    
    kun::RayCastingRenderer2D* renderer = new kun::RayCastingRenderer2D();
    
    renderer->setSecondVolume( volume_2 );
    renderer->setTransferFunction( tfunc );
    renderer->disableShading();
    
    screen.registerObject( volume_1, renderer );
    screen.show();
    
    return( app.run() );   
}