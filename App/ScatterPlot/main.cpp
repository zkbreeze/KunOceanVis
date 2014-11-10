//
//  main.cpp
//
//
//  Created by Kun Zhao on 2014-11-06 11:13:15.
//
//

#include <kvs/StructuredVolumeObject>
#include <kvs/StructuredVolumeImporter>
#include <kvs/TableObject>
#include <kvs/ScatterPlotRenderer>
#include <kvs/glut/Application>
#include <kvs/glut/Screen>
#include <kvs/glut/Axis2D>
#include <kvs/ColorMap>
#include <kvs/TransferFunction>

int main( int argc, char** argv )
{
    kvs::glut::Application app( argc, argv );

    kvs::StructuredVolumeObject* volume1 = new kvs::StructuredVolumeImporter( argv[1] );
    kvs::StructuredVolumeObject* volume2 = new kvs::StructuredVolumeImporter( argv[2] );

    kvs::TableObject* object = new kvs::TableObject();
    object->addColumn( volume1->values(), "" );
    object->addColumn( volume2->values(), "" );
    object->setMinValue( 0, 31 );
    object->setMinValue( 1, 0 );
    object->setMaxValue( 0, 35 );
    object->setMaxValue( 1, 24 );

    delete volume1;
    delete volume2;

    kvs::ScatterPlotRenderer* renderer = new kvs::ScatterPlotRenderer();
    renderer->setBackgroundColor( kvs::RGBAColor( 255, 255, 255, 0.5f ) );
    renderer->setPointSize( 0.05f );
    renderer->setPointOpacity( 28 );
    
    kvs::TransferFunction tfunc(256);
    renderer->setColorMap( tfunc.colorMap() );

    kvs::glut::Axis2D* axis = new kvs::glut::Axis2D();
    axis->setAxisWidth( 5.0 );

    kvs::glut::Screen screen( &app );
    screen.registerObject( object, renderer );
    screen.registerObject( object, axis );
    screen.setTitle( "ScatterPlot" );
    screen.setBackgroundColor( kvs::RGBColor( 255, 255, 255 ));
    screen.show();

    return app.run();
}
